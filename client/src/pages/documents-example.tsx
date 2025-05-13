import { PageLayout } from "@/components/PageLayout";
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Box,
  Text,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

export default function DocumentsExample() {
  return (
    <PageLayout title="Documents">
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>All</Tab>
          <Tab>Recent</Tab>
          <Tab>Contracts</Tab>
        </TabList>

        <TabPanels mt={4}>
          <TabPanel>
            <Text>No documents yet.</Text>
          </TabPanel>
          <TabPanel>
            <Text>No recent documents.</Text>
          </TabPanel>
          <TabPanel>
            <Text>No contracts available.</Text>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Box mt={8}>
        <Button colorScheme="blue" leftIcon={<AddIcon />}>
          Upload Document
        </Button>
      </Box>
    </PageLayout>
  );
}