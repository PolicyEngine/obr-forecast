"""
Caching utilities for FastAPI requests
"""
import functools
import hashlib
import json
import time
import logging
import inspect
from typing import Any, Callable, Dict, Optional, TypeVar, cast
from fastapi import Response
from pydantic import BaseModel

# Configure logging
logger = logging.getLogger(__name__)

T = TypeVar("T")

# In-memory cache with TTL
cache_store: Dict[str, Dict[str, Any]] = {}
cache_stats = {"hits": 0, "misses": 0}

def serialize_for_cache(obj):
    """Serialize objects for caching, handling special cases like Pydantic models"""
    if isinstance(obj, BaseModel):
        return obj.model_dump()
    elif hasattr(obj, "__dict__"):
        # For other objects with __dict__, use that for serialization
        return {k: serialize_for_cache(v) for k, v in obj.__dict__.items()
                if not k.startswith("_") and not callable(v)}
    elif isinstance(obj, (list, tuple)):
        return [serialize_for_cache(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: serialize_for_cache(v) for k, v in obj.items()}
    else:
        # For primitive types, just return as is
        return obj

def get_cache_key(func_name: str, *args, **kwargs) -> str:
    """Generate a unique cache key based on function name and arguments"""
    # Process args and kwargs to make them serializable
    processed_args = [serialize_for_cache(arg) for arg in args 
                      if not isinstance(arg, Response)]
    processed_kwargs = {k: serialize_for_cache(v) for k, v in kwargs.items()}
    
    try:
        # Convert processed args and kwargs to a string for hashing
        args_str = json.dumps(processed_args, sort_keys=True)
        kwargs_str = json.dumps(processed_kwargs, sort_keys=True)
        
        # Create a hash of the function name and arguments
        key_string = f"{func_name}:{args_str}:{kwargs_str}"
        return hashlib.md5(key_string.encode()).hexdigest()
    except TypeError as e:
        # If we can't serialize something, log the error and return a fallback key
        logger.warning(f"Cache key generation failed: {e}")
        return hashlib.md5(func_name.encode()).hexdigest()

def cached(ttl_seconds: int = 3600) -> Callable[[Callable[..., T]], Callable[..., T]]:
    """
    Decorator to cache function results with a time-to-live.
    
    Args:
        ttl_seconds: Time to live in seconds for cached results
        
    Returns:
        Decorated function with caching
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            # Get the request and response objects if present
            response_obj = None
            for arg in args:
                if isinstance(arg, Response):
                    response_obj = arg
            
            try:
                # Generate a unique key for this function call
                cache_key = get_cache_key(func.__name__, *args, **kwargs)
                
                # Check if result is in cache and not expired
                if cache_key in cache_store:
                    entry = cache_store[cache_key]
                    if entry["expires"] > time.time():
                        cache_stats["hits"] += 1
                        logger.debug(f"Cache hit for {func.__name__}")
                        
                        # Set cache headers if we have a response object
                        if response_obj:
                            response_obj.headers["X-Cache-Hit"] = "hit"
                            
                        return cast(T, entry["data"])
                
                # If not in cache or expired, call the function
                cache_stats["misses"] += 1
                logger.debug(f"Cache miss for {func.__name__}")
                
                # Set cache headers if we have a response object
                if response_obj:
                    response_obj.headers["X-Cache-Hit"] = "miss"
                    
                result = await func(*args, **kwargs)
                
                # Store the result in cache
                cache_store[cache_key] = {
                    "data": result,
                    "expires": time.time() + ttl_seconds
                }
                
                return result
            except Exception as e:
                # If caching fails for any reason, just execute the function
                logger.error(f"Caching error in {func.__name__}: {e}")
                return await func(*args, **kwargs)
        return wrapper
    return decorator

def clear_cache() -> None:
    """Clear all cache entries"""
    cache_store.clear()
    logger.info("Cache cleared")

def remove_expired_cache_entries() -> None:
    """Remove expired cache entries"""
    current_time = time.time()
    keys_to_remove = [k for k, v in cache_store.items() if v["expires"] <= current_time]
    if keys_to_remove:
        for key in keys_to_remove:
            del cache_store[key]
        logger.info(f"Removed {len(keys_to_remove)} expired cache entries")

def get_cache_stats() -> Dict[str, Any]:
    """Get cache statistics and info"""
    stats = {
        "hits": cache_stats["hits"],
        "misses": cache_stats["misses"],
        "hit_ratio": cache_stats["hits"] / (cache_stats["hits"] + cache_stats["misses"]) if (cache_stats["hits"] + cache_stats["misses"]) > 0 else 0,
        "entries": len(cache_store),
        "memory_usage_estimate_kb": len(json.dumps({k: v.get("expires", 0) for k, v in cache_store.items()})) / 1024,
    }
    return stats