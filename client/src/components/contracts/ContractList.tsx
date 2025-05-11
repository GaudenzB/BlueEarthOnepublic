import React from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileContractIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  HourglassIcon,
  FileIcon,
  BanIcon,
  ArchiveIcon,
} from "lucide-react";

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
  // Helper for rendering status badges with appropriate colors and icons
  const renderStatusBadge = (status: string) => {
    const getStatusInfo = () => {
      switch (status) {
        case "DRAFT":
          return { color: "bg-gray-200 text-gray-800", icon: <FileIcon className="h-3 w-3 mr-1" /> };
        case "PENDING":
          return { color: "bg-yellow-100 text-yellow-800", icon: <HourglassIcon className="h-3 w-3 mr-1" /> };
        case "UNDER_REVIEW":
          return { color: "bg-blue-100 text-blue-800", icon: <ClockIcon className="h-3 w-3 mr-1" /> };
        case "ACTIVE":
          return { color: "bg-green-100 text-green-800", icon: <CheckCircleIcon className="h-3 w-3 mr-1" /> };
        case "EXPIRED":
          return { color: "bg-orange-100 text-orange-800", icon: <AlertTriangleIcon className="h-3 w-3 mr-1" /> };
        case "TERMINATED":
          return { color: "bg-red-100 text-red-800", icon: <BanIcon className="h-3 w-3 mr-1" /> };
        case "ARCHIVED":
          return { color: "bg-slate-100 text-slate-800", icon: <ArchiveIcon className="h-3 w-3 mr-1" /> };
        default:
          return { color: "bg-gray-100 text-gray-800", icon: <FileContractIcon className="h-3 w-3 mr-1" /> };
      }
    };

    const { color, icon } = getStatusInfo();

    return (
      <Badge className={`${color} flex items-center`} variant="outline">
        {icon}
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Contracts</CardTitle>
          <CardDescription>Loading contract list...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter contracts based on the filter prop
  const filteredContracts = contracts.filter((contract) => {
    if (filter === "all") return true;
    if (filter === "active") return contract.status === "ACTIVE";
    if (filter === "expiring") {
      // Check if contract expires within 90 days
      if (!contract.expirationDate) return false;
      const expirationDate = new Date(contract.expirationDate);
      const today = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(today.getDate() + 90);
      return expirationDate <= ninetyDaysFromNow && expirationDate >= today;
    }
    if (filter === "recent") {
      // Show contracts created in the last 30 days
      const createdDate = new Date(contract.createdAt);
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      return createdDate >= thirtyDaysAgo;
    }
    return true;
  });

  if (filteredContracts.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileContractIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">No contracts found</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-md">
              {filter === "all" 
                ? "There are no contracts in the system yet." 
                : filter === "active" 
                  ? "There are no active contracts at this time."
                  : filter === "expiring"
                    ? "No contracts are expiring soon."
                    : "No recent contracts found."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contract</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Effective Date</TableHead>
              <TableHead>Expiration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">
                  <Link href={`/contracts/${contract.id}`} className="text-primary hover:underline">
                    {contract.title}
                    <div className="text-xs text-gray-500">#{contract.contractNumber}</div>
                  </Link>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{contract.contractType.replace(/_/g, " ")}</span>
                </TableCell>
                <TableCell>{contract.counterpartyName}</TableCell>
                <TableCell>{renderStatusBadge(contract.status)}</TableCell>
                <TableCell>
                  {contract.currency} {contract.value}
                </TableCell>
                <TableCell>
                  <span>{new Date(contract.effectiveDate).toLocaleDateString()}</span>
                </TableCell>
                <TableCell>
                  {contract.expirationDate ? (
                    <div className="flex flex-col">
                      <span>{new Date(contract.expirationDate).toLocaleDateString()}</span>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(contract.expirationDate), { addSuffix: true })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No expiration</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}