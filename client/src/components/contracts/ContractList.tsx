import React from "react";
import { Link } from "wouter";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileTextIcon, 
  FileCheckIcon,
  FileX2Icon, 
  MoreHorizontalIcon, 
  ClockIcon,
  GavelIcon,
  BuildingIcon,
  LandmarkIcon,
  FileSignatureIcon, 
  UsersIcon,
  KeyIcon,
  CreditCardIcon,
  HandshakeIcon,
  DollarSignIcon
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { PermissionGuard } from "@/components/permissions/PermissionGuard";

type Contract = {
  id: string;
  title: string;
  contractNumber: string;
  contractType: string;
  status: string;
  counterpartyName: string;
  effectiveDate: string;
  expirationDate: string;
  value: string;
  currency: string;
  createdAt: string;
};

interface ContractListProps {
  contracts: Contract[];
  isLoading: boolean;
  filter?: string;
}

export default function ContractList({ contracts, isLoading, filter = "all" }: ContractListProps) {
  const getContractTypeIcon = (type: string | null) => {
    switch (type) {
      case "SERVICE_AGREEMENT":
        return <FileSignatureIcon className="h-4 w-4" />;
      case "EMPLOYMENT":
        return <UsersIcon className="h-4 w-4" />;
      case "VENDOR":
        return <BuildingIcon className="h-4 w-4" />;
      case "LICENSE":
        return <KeyIcon className="h-4 w-4" />;
      case "LEASE":
        return <LandmarkIcon className="h-4 w-4" />;
      case "NDA":
        return <FileCheckIcon className="h-4 w-4" />;
      case "INVESTMENT":
        return <CreditCardIcon className="h-4 w-4" />;
      case "PARTNERSHIP":
        return <HandshakeIcon className="h-4 w-4" />;
      case "LOAN":
        return <DollarSignIcon className="h-4 w-4" />;
      default:
        return <GavelIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge variant="success" className="gap-1 px-2"><FileCheckIcon className="h-3 w-3" /> Active</Badge>;
      case "UNDER_REVIEW":
        return <Badge variant="warning" className="gap-1 px-2"><ClockIcon className="h-3 w-3" /> Under Review</Badge>;
      case "PENDING":
      case "DRAFT":
        return <Badge variant="outline" className="gap-1 px-2"><ClockIcon className="h-3 w-3" /> Draft</Badge>;
      case "EXPIRED":
      case "TERMINATED":
        return <Badge variant="destructive" className="gap-1 px-2"><FileX2Icon className="h-3 w-3" /> Expired</Badge>;
      case "ARCHIVED":
        return <Badge variant="secondary" className="gap-1 px-2"><FileTextIcon className="h-3 w-3" /> Archived</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1 px-2"><FileTextIcon className="h-3 w-3" /> {status}</Badge>;
    }
  };

  const filteredContracts = React.useMemo(() => {
    if (filter === "all") {
      return contracts;
    } else if (filter === "recent") {
      // Sort by created date and get first 10
      return [...contracts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
    } else if (filter === "active") {
      // Filter active contracts
      return contracts.filter(contract => contract.status === "ACTIVE");
    } else if (filter === "expiring") {
      // Filter contracts expiring in the next 90 days
      const now = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(now.getDate() + 90);
      
      return contracts.filter(contract => {
        if (!contract.expirationDate) return false;
        const expirationDate = new Date(contract.expirationDate);
        return expirationDate >= now && expirationDate <= ninetyDaysFromNow;
      });
    } else {
      // Filter by contract type
      return contracts.filter(contract => contract.contractType === filter);
    }
  }, [contracts, filter]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
                <TableHead><Skeleton className="h-4 w-full" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[40px]" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (filteredContracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 border rounded-md bg-muted/10">
        <GavelIcon className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-medium">No contracts found</h3>
        <p className="text-muted-foreground mb-4">
          {filter === "all" 
            ? "No contracts have been added yet."
            : filter === "recent"
              ? "No recent contracts found."
              : filter === "active"
                ? "No active contracts found."
                : filter === "expiring"
                  ? "No contracts expiring in the next 90 days."
                  : `No ${filter.toLowerCase().replace('_', ' ')} contracts found.`}
        </p>
        <PermissionGuard area="contracts" permission="edit">
          <Button variant="outline">Add your first contract</Button>
        </PermissionGuard>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%]">Contract</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Counterparty</TableHead>
            <TableHead>Expiration</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredContracts.map((contract) => (
            <TableRow key={contract.id}>
              <TableCell className="font-medium">
                <Link href={`/contracts/${contract.id}`}>
                  <div className="flex items-center gap-2 text-primary hover:underline cursor-pointer">
                    {getContractTypeIcon(contract.contractType)}
                    <div>
                      <span className="block">{contract.title}</span>
                      <span className="text-xs text-muted-foreground">{contract.contractNumber}</span>
                    </div>
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                {contract.contractType?.replace('_', ' ') || "Other"}
              </TableCell>
              <TableCell>
                {getStatusBadge(contract.status)}
              </TableCell>
              <TableCell>
                {contract.counterpartyName || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contract.expirationDate 
                  ? format(new Date(contract.expirationDate), "MMM d, yyyy")
                  : "—"
                }
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontalIcon className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Link href={`/contracts/${contract.id}`}>
                        <span>View details</span>
                      </Link>
                    </DropdownMenuItem>
                    <PermissionGuard area="contracts" permission="view">
                      <DropdownMenuItem>Download</DropdownMenuItem>
                    </PermissionGuard>
                    <PermissionGuard area="contracts" permission="edit">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                    </PermissionGuard>
                    <PermissionGuard area="contracts" permission="delete">
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </PermissionGuard>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}