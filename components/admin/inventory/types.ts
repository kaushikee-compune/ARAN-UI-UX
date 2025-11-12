export type InventoryItem = {
   id: string;
  branchId: string; 
  name: string;
  category: string;
  unit: string;
  stockQty: number;
  threshold: number;
  supplier?: string;
};
