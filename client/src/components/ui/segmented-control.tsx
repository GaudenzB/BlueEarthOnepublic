import React from 'react';
import { Box, Text } from '@chakra-ui/react';

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: React.ReactNode | string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  backgroundColor?: string;
  selectedColor?: string;
  textColor?: string;
  selectedTextColor?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  backgroundColor = 'gray.100',
  selectedColor = 'white',
  textColor = 'gray.600',
  selectedTextColor = 'gray.800',
  size = 'md',
}) => {
  // Determine padding and font size based on size prop
  const getPadding = () => {
    switch (size) {
      case 'sm': return { py: 1.5, px: 3 };
      case 'lg': return { py: 2.5, px: 5 };
      default: return { py: 2, px: 4 };
    }
  };
  
  const getFontSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'md';
      default: return 'sm';
    }
  };
  
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'md';
      case 'lg': return 'xl';
      default: return 'lg';
    }
  };
  
  const { py, px } = getPadding();
  const fontSize = getFontSize();
  const iconSize = getIconSize();

  return (
    <Box 
      display="flex"
      borderRadius="lg"
      bg={backgroundColor}
      p={1}
      maxW="fit-content"
    >
      {options.map((option) => (
        <Box
          key={option.value}
          as="button"
          py={py}
          px={px}
          borderRadius="md"
          display="flex"
          alignItems="center"
          gap={2}
          bg={value === option.value ? selectedColor : 'transparent'}
          color={value === option.value ? selectedTextColor : textColor}
          fontWeight={value === option.value ? "medium" : "normal"}
          boxShadow={value === option.value ? "sm" : "none"}
          onClick={() => onChange(option.value)}
          _hover={{
            bg: value === option.value ? selectedColor : 'gray.200',
          }}
          transition="all 0.2s"
        >
          {option.icon && (
            typeof option.icon === 'string' 
              ? <Box as="span" fontSize={iconSize}>{option.icon}</Box>
              : option.icon
          )}
          <Text fontSize={fontSize}>{option.label}</Text>
        </Box>
      ))}
    </Box>
  );
};

export default SegmentedControl;