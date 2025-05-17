import React from 'react';
import { Route, Switch } from 'wouter';
import ContractList from './pages/ContractList';
import ContractDetail from './pages/ContractDetail';
import ContractWizard from './pages/ContractWizard.shadcn';

// Feature flag check
const isContractsEnabled = () => {
  // Feature is always enabled in development (for testing purposes)
  if (import.meta.env.MODE === 'development') {
    return true;
  }
  
  // Use the standard VITE_ENABLE_CONTRACTS flag for consistency
  return import.meta.env.VITE_ENABLE_CONTRACTS === 'true';
};

/**
 * Contract module routes
 */
export const ContractRoutes: React.FC = () => {
  // Skip rendering if contracts are not enabled
  if (!isContractsEnabled()) {
    return null;
  }

  return (
    <Switch>
      {/* Specific routes must come before dynamic ones for wouter to match correctly */}
      <Route path="/new" component={() => <ContractWizard />} />
      <Route path="/:id/edit" component={(params) => 
        <ContractWizard documentId={params.params.id} />
      } />
      <Route path="/:id" component={ContractDetail} />
      <Route path="/" component={ContractList} />
    </Switch>
  );
};

// Default export for backward compatibility
export default ContractRoutes;