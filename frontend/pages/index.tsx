import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { ForecastSelector } from '../components/ForecastSelector';
import { ImpactChart } from '../components/ImpactChart';

const Home: NextPage = () => {
  return (
    <Box>
      <Head>
        <title>OBR Forecast Impact Estimator</title>
        <meta name="description" content="Estimate the impact of OBR forecasts using PolicyEngine" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" py={8}>
            <Heading as="h1" size="2xl" mb={4}>
              OBR Forecast Impact Estimator
            </Heading>
            <Text fontSize="xl">
              Analyze the impact of Office for Budget Responsibility forecasts using PolicyEngine
            </Text>
          </Box>
          
          <ForecastSelector />
          
          <ImpactChart />
        </VStack>
      </Container>
    </Box>
  );
};

export default Home;
