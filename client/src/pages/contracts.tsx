import React from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  PlusIcon,
  FilterIcon,
  RefreshCwIcon,
  FileTextIcon,
  UploadIcon,
  GavelIcon,
} from "lucide-react";
import ContractList from "@/components/contracts/ContractList";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";
//import { PageLayout } from "@/components/layouts/PageLayout";

export default function Contracts() {
  const [activeTab, setActiveTab] = React.useState("all");

  // Query for fetching contracts
  const { data: contracts, isLoading, refetch } = useQuery({
    queryKey: ["/api/contracts"],
    retry: false,
    // This is just placeholder data until the API is implemented
    queryFn: async () => {
      const mockContracts = [
        {
          id: "1",
          title: "Office Lease Agreement",
          contractNumber: "CT-2025-001",
          contractType: "LEASE",
          status: "ACTIVE",
          counterpartyName: "Lakeside Properties Ltd",
          effectiveDate: "2025-01-01",
          expirationDate: "2026-12-31",
          value: "125000",
          currency: "USD",
          createdAt: "2025-01-01",
        },
        {
          id: "2",
          title: "IT Support Services",
          contractNumber: "CT-2025-002",
          contractType: "SERVICE_AGREEMENT",
          status: "ACTIVE",
          counterpartyName: "TechSupport Inc",
          effectiveDate: "2025-02-15",
          expirationDate: "2026-02-14",
          value: "48000",
          currency: "USD",
          createdAt: "2025-02-10",
        },
        {
          id: "3",
          title: "Investment Management Agreement",
          contractNumber: "CT-2025-003",
          contractType: "INVESTMENT",
          status: "PENDING",
          counterpartyName: "Global Invest Partners",
          effectiveDate: "2025-03-01",
          expirationDate: null,
          value: "500000",
          currency: "USD",
          createdAt: "2025-02-25",
        },
        {
          id: "4",
          title: "Confidentiality Agreement",
          contractNumber: "CT-2025-004",
          contractType: "NDA",
          status: "ACTIVE",
          counterpartyName: "Potential Partner LLC",
          effectiveDate: "2025-02-20",
          expirationDate: "2026-02-19",
          value: "0",
          currency: "USD",
          createdAt: "2025-02-18",
        },
        {
          id: "5",
          title: "Software License Agreement",
          contractNumber: "CT-2025-005",
          contractType: "LICENSE",
          status: "ACTIVE",
          counterpartyName: "Enterprise Software Co",
          effectiveDate: "2025-02-01",
          expirationDate: "2026-01-31",
          value: "75000",
          currency: "USD",
          createdAt: "2025-01-25",
        },
        {
          id: "6",
          title: "Employee Contract Template",
          contractNumber: "CT-2025-006",
          contractType: "EMPLOYMENT",
          status: "DRAFT",
          counterpartyName: null,
          effectiveDate: null,
          expirationDate: null,
          value: "0",
          currency: "USD",
          createdAt: "2025-03-01",
        },
      ];
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockContracts;
    }
  });

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <Helmet>
        <title>Contracts | BlueEarth Capital</title>
        <meta
          name="description"
          content="Manage and track contracts for BlueEarth Capital"
        />
      </Helmet>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">
            Manage and track your organization's contracts and agreements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1"
          >
            <RefreshCwIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <PermissionGuard area="contracts" permission="edit">
            <Button variant="default" size="sm" className="gap-1">
              <PlusIcon className="h-4 w-4" />
              <span>Add Contract</span>
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Tabs
        defaultValue="all"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-1">
              <GavelIcon className="h-4 w-4" />
              <span className="hidden sm:inline">All Contracts</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-1">
              <FileTextIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Active</span>
            </TabsTrigger>
            <TabsTrigger value="expiring" className="gap-1">
              <UploadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Expiring Soon</span>
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-1">
              <FileTextIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Recent</span>
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" className="gap-1">
            <FilterIcon className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>

        <TabsContent value="all" className="p-0 border-none">
          <ContractList
            contracts={contracts || []}
            isLoading={isLoading}
            filter="all"
          />
        </TabsContent>
        <TabsContent value="active" className="p-0 border-none">
          <ContractList
            contracts={contracts || []}
            isLoading={isLoading}
            filter="active"
          />
        </TabsContent>
        <TabsContent value="expiring" className="p-0 border-none">
          <ContractList
            contracts={contracts || []}
            isLoading={isLoading}
            filter="expiring"
          />
        </TabsContent>
        <TabsContent value="recent" className="p-0 border-none">
          <ContractList
            contracts={contracts || []}
            isLoading={isLoading}
            filter="recent"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}