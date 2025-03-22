from setuptools import setup, find_packages

setup(
    name="obr-forecast",
    version="0.1.0",
    author="Nikhil Woodruff",
    author_email="nikhil.woodruff@policyengine.org",
    description="OBR forecast impact estimator using PolicyEngine",
    packages=find_packages(),
    python_requires="==3.11.*",
    install_requires=[
        "fastapi",
        "uvicorn",
        "policyengine==0.1.2",
    ],
)