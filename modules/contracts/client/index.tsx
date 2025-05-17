import React from 'react';
import { Route, Switch } from 'wouter';
import ContractList from './pages/ContractList';
import ContractDetail from './pages/ContractDetail';
import ContractWizard from './pages/ContractWizard';

// Feature flag check
const isContractsEnabled = () => {
  return process.env.ENABLE_CONTRACTS === 'true';
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
      <Route path="/contracts" component={ContractList} />
      <Route path="/contracts/new" component={() => <ContractWizard />} />
      <Route path="/contracts/:id/edit" component={(params) => 
        <ContractWizard documentId={params.id} />
      } />
      <Route path="/contracts/:id" component={ContractDetail} />
    </Switch>
  );
};

export default ContractRoutes;