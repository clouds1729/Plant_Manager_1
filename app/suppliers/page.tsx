'use client';
import { CrudTable } from '@/components/crud-table';
import { supplierSchema } from '@/lib/validations/schemas';

export default function SuppliersPage() {
  return <CrudTable table='suppliers' schema={supplierSchema} title='Suppliers' fields={[{name:'name',label:'Name'},{name:'contact_name',label:'Contact'}]} />;
}
