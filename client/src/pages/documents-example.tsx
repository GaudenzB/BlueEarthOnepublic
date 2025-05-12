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
  VStack,
  Heading,
  Flex,
  useRadioGroup,
  useRadio,
  HStack,
  Card,
  CardBody,
  Divider,
  Stack,
  useColorModeValue,
  Icon,
} from "@chakra-ui/react";
import { AddIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useState } from "react";

// Custom Radio Tab Component
function RadioTab(props: any) {
  const { getInputProps, getRadioProps } = useRadio(props);
  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label" w="full">
      <input {...input} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="2px"
        borderRadius="md"
        borderColor="transparent"
        borderBottomColor={props.isChecked ? "brand.500" : "transparent"}
        px={4}
        py={3}
        color={props.isChecked ? "brand.500" : "gray.500"}
        fontWeight={props.isChecked ? "600" : "normal"}
        _hover={{
          color: props.isChecked ? "brand.600" : "gray.600",
        }}
        transition="all 0.2s"
        textAlign="center"
      >
        {props.children}
      </Box>
    </Box>
  );
}

// Pill Tab Component
function PillTab({ isSelected, label, onClick }: { isSelected: boolean; label: string; onClick: () => void }) {
  return (
    <Box
      as="button"
      px={4}
      py={2}
      borderRadius="full"
      bg={isSelected ? "brand.500" : "gray.100"}
      color={isSelected ? "white" : "gray.600"}
      fontWeight={isSelected ? "medium" : "normal"}
      onClick={onClick}
      _hover={{
        bg: isSelected ? "brand.600" : "gray.200",
      }}
      transition="all 0.2s"
    >
      {label}
    </Box>
  );
}

// Card Tab Component
function CardTab({ isSelected, label, icon, onClick }: { isSelected: boolean; label: string; icon: any; onClick: () => void }) {
  return (
    <Card
      as="button"
      direction="row"
      overflow="hidden"
      variant="outline"
      p={3}
      alignItems="center"
      borderWidth={isSelected ? "2px" : "1px"}
      borderColor={isSelected ? "brand.500" : "gray.200"}
      cursor="pointer"
      onClick={onClick}
      _hover={{
        borderColor: isSelected ? "brand.600" : "gray.300",
        bg: "gray.50",
      }}
      transition="all 0.2s"
      mb={2}
    >
      <Icon as={icon} boxSize={5} color={isSelected ? "brand.500" : "gray.400"} mr={3} />
      <Text fontWeight={isSelected ? "medium" : "normal"} color={isSelected ? "brand.700" : "gray.700"}>
        {label}
      </Text>
      {isSelected && <ChevronRightIcon ml="auto" color="brand.500" />}
    </Card>
  );
}

export default function DocumentsPage() {
  const [tabStyle, setTabStyle] = useState<'default' | 'line' | 'enclosed' | 'soft-rounded' | 'radio' | 'pill' | 'card'>('default');
  const [tabIndex, setTabIndex] = useState(0);
  
  // Tab style for radio tabs
  const { getRootProps: getRadioRootProps, getRadioProps } = useRadioGroup({
    name: 'tab-style',
    defaultValue: 'all',
    onChange: (value) => {
      switch (value) {
        case 'all': setTabIndex(0); break;
        case 'recent': setTabIndex(1); break;
        case 'contracts': setTabIndex(2); break;
      }
    },
  });
  
  // Tab style for pill tabs
  const handlePillTabClick = (index: number) => {
    setTabIndex(index);
  };
  
  // Render the appropriate tab style based on selection
  const renderTabs = () => {
    switch (tabStyle) {
      case 'default':
        return (
          <Tabs colorScheme="brand" index={tabIndex} onChange={setTabIndex}>
            <TabList>
              <Tab>All</Tab>
              <Tab>Recent</Tab>
              <Tab>Contracts</Tab>
            </TabList>
            <TabPanels mt={4}>
              <TabPanel><Text>No documents yet. (Default style)</Text></TabPanel>
              <TabPanel><Text>No recent documents. (Default style)</Text></TabPanel>
              <TabPanel><Text>No contracts available. (Default style)</Text></TabPanel>
            </TabPanels>
          </Tabs>
        );
        
      case 'line':
        return (
          <Tabs variant="line" colorScheme="brand" index={tabIndex} onChange={setTabIndex}>
            <TabList>
              <Tab>All</Tab>
              <Tab>Recent</Tab>
              <Tab>Contracts</Tab>
            </TabList>
            <TabPanels mt={4}>
              <TabPanel><Text>No documents yet. (Line style)</Text></TabPanel>
              <TabPanel><Text>No recent documents. (Line style)</Text></TabPanel>
              <TabPanel><Text>No contracts available. (Line style)</Text></TabPanel>
            </TabPanels>
          </Tabs>
        );
        
      case 'enclosed':
        return (
          <Tabs variant="enclosed" colorScheme="brand" index={tabIndex} onChange={setTabIndex}>
            <TabList>
              <Tab>All</Tab>
              <Tab>Recent</Tab>
              <Tab>Contracts</Tab>
            </TabList>
            <TabPanels mt={4}>
              <TabPanel><Text>No documents yet. (Enclosed style)</Text></TabPanel>
              <TabPanel><Text>No recent documents. (Enclosed style)</Text></TabPanel>
              <TabPanel><Text>No contracts available. (Enclosed style)</Text></TabPanel>
            </TabPanels>
          </Tabs>
        );
        
      case 'soft-rounded':
        return (
          <Tabs variant="soft-rounded" colorScheme="brand" index={tabIndex} onChange={setTabIndex}>
            <TabList>
              <Tab>All</Tab>
              <Tab>Recent</Tab>
              <Tab>Contracts</Tab>
            </TabList>
            <TabPanels mt={4}>
              <TabPanel><Text>No documents yet. (Soft-rounded style)</Text></TabPanel>
              <TabPanel><Text>No recent documents. (Soft-rounded style)</Text></TabPanel>
              <TabPanel><Text>No contracts available. (Soft-rounded style)</Text></TabPanel>
            </TabPanels>
          </Tabs>
        );
        
      case 'radio':
        const radioGroup = getRadioRootProps();
        return (
          <Box>
            <HStack {...radioGroup} spacing={0} borderBottomWidth="1px" borderColor="gray.200">
              <RadioTab {...getRadioProps({ value: 'all' })} isChecked={tabIndex === 0}>All</RadioTab>
              <RadioTab {...getRadioProps({ value: 'recent' })} isChecked={tabIndex === 1}>Recent</RadioTab>
              <RadioTab {...getRadioProps({ value: 'contracts' })} isChecked={tabIndex === 2}>Contracts</RadioTab>
            </HStack>
            <Box mt={4} p={4}>
              {tabIndex === 0 && <Text>No documents yet. (Radio style)</Text>}
              {tabIndex === 1 && <Text>No recent documents. (Radio style)</Text>}
              {tabIndex === 2 && <Text>No contracts available. (Radio style)</Text>}
            </Box>
          </Box>
        );
        
      case 'pill':
        return (
          <Box>
            <HStack spacing={3} mb={4}>
              <PillTab isSelected={tabIndex === 0} label="All" onClick={() => handlePillTabClick(0)} />
              <PillTab isSelected={tabIndex === 1} label="Recent" onClick={() => handlePillTabClick(1)} />
              <PillTab isSelected={tabIndex === 2} label="Contracts" onClick={() => handlePillTabClick(2)} />
            </HStack>
            <Box mt={4} p={4} bg="white" borderRadius="md" shadow="sm">
              {tabIndex === 0 && <Text>No documents yet. (Pill style)</Text>}
              {tabIndex === 1 && <Text>No recent documents. (Pill style)</Text>}
              {tabIndex === 2 && <Text>No contracts available. (Pill style)</Text>}
            </Box>
          </Box>
        );
        
      case 'card':
        return (
          <Flex direction={{ base: "column", md: "row" }} gap={6}>
            <VStack align="stretch" spacing={2} w={{ base: "100%", md: "250px" }}>
              <CardTab 
                isSelected={tabIndex === 0} 
                label="All Documents" 
                icon={() => <AddIcon />} 
                onClick={() => setTabIndex(0)} 
              />
              <CardTab 
                isSelected={tabIndex === 1} 
                label="Recent" 
                icon={() => <AddIcon />} 
                onClick={() => setTabIndex(1)} 
              />
              <CardTab 
                isSelected={tabIndex === 2} 
                label="Contracts" 
                icon={() => <AddIcon />} 
                onClick={() => setTabIndex(2)} 
              />
            </VStack>
            <Box flex={1} p={6} bg="white" borderRadius="md" shadow="sm">
              {tabIndex === 0 && <Text>No documents yet. (Card style)</Text>}
              {tabIndex === 1 && <Text>No recent documents. (Card style)</Text>}
              {tabIndex === 2 && <Text>No contracts available. (Card style)</Text>}
            </Box>
          </Flex>
        );
    }
  };

  return (
    <PageLayout title="Document Tab Styles">
      <Card mb={8}>
        <CardBody>
          <Heading size="md" mb={4}>Select Tab Style</Heading>
          <HStack spacing={3} wrap="wrap">
            <Button 
              size="sm" 
              colorScheme={tabStyle === 'default' ? 'brand' : 'gray'} 
              onClick={() => setTabStyle('default')}
            >
              Default
            </Button>
            <Button 
              size="sm" 
              colorScheme={tabStyle === 'line' ? 'brand' : 'gray'} 
              onClick={() => setTabStyle('line')}
            >
              Line
            </Button>
            <Button 
              size="sm" 
              colorScheme={tabStyle === 'enclosed' ? 'brand' : 'gray'} 
              onClick={() => setTabStyle('enclosed')}
            >
              Enclosed
            </Button>
            <Button 
              size="sm" 
              colorScheme={tabStyle === 'soft-rounded' ? 'brand' : 'gray'} 
              onClick={() => setTabStyle('soft-rounded')}
            >
              Soft Rounded
            </Button>
            <Button 
              size="sm" 
              colorScheme={tabStyle === 'radio' ? 'brand' : 'gray'} 
              onClick={() => setTabStyle('radio')}
            >
              Radio
            </Button>
            <Button 
              size="sm" 
              colorScheme={tabStyle === 'pill' ? 'brand' : 'gray'} 
              onClick={() => setTabStyle('pill')}
            >
              Pill
            </Button>
            <Button 
              size="sm" 
              colorScheme={tabStyle === 'card' ? 'brand' : 'gray'} 
              onClick={() => setTabStyle('card')}
            >
              Card
            </Button>
          </HStack>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Box mb={8}>
            {renderTabs()}
          </Box>

          <Divider my={6} />

          <Box>
            <Button colorScheme="brand" leftIcon={<AddIcon />}>
              Upload Document
            </Button>
          </Box>
        </CardBody>
      </Card>
    </PageLayout>
  );
}