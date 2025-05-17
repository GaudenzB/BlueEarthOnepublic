import React from 'react';
import { Route, Switch } from 'wouter';
import ContractList from './pages/ContractList';
import ContractDetail from './pages/ContractDetail';
import ContractWizard from './pages/ContractWizard.shadcn';

// Feature flag check
const isContractsEnabled = () => {
  return import.meta.env['ENABLE_CONTRACTS'] === 'true';
};

/**
 * Contract module routes
 */
const ContractRoutes: React.FC = () => {
  // Skip rendering if contracts are not enabled
  if (!isContractsEnabled()) {
    return null;
  }

  return (
    <Switch>
      <Route path="/" component={ContractList} />
      <Route path="/new" component={() => <ContractWizard />} />
      <Route path="/:id/edit" component={(params) => 
        <ContractWizard documentId={params.params.id} />
      } />
      <Route path="/:id" component={ContractDetail} />
    </Switch>
  );
};

export default ContractRoutes;