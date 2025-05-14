import React from 'react';
import { Segmented, Space } from 'antd';
import type { SegmentedProps } from 'antd';
import { theme } from '../../lib/theme';

export interface SegmentedControlOption {
  value: string;
  label: string | React.ReactNode;
  icon?: React.ReactNode | string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string | number) => void;
  backgroundColor?: string;
  selectedColor?: string; // No longer used, controlled by Ant Design theme
  textColor?: string; // No longer used, controlled by Ant Design theme
  selectedTextColor?: string; // No longer used, controlled by Ant Design theme
  size?: 'small' | 'middle' | 'large'; // Changed to Ant Design sizes
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  backgroundColor = theme.colors.background.subtle,
  size = 'middle',
}) => {
  // Convert our options format to Ant Design's expected format
  const segmentedOptions: SegmentedProps['options'] = options.map(option => {
    if (option.icon) {
      return {
        label: (
          <Space style={{ display: 'flex', alignItems: 'center' }}>
            {typeof option.icon === 'string' ? option.icon : option.icon}
            <span>{option.label}</span>
          </Space>
        ),
        value: option.value
      };
    }
    return {
      label: option.label,
      value: option.value
    };
  });

  return (
    <Segmented
      options={segmentedOptions}
      value={value}
      onChange={onChange}
      size={size}
      style={{
        backgroundColor,
        padding: '2px',
        borderRadius: '8px',
      }}
    />
  );
};

export default SegmentedControl;