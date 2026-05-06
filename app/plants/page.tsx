'use client';
import { CrudTable } from '@/components/crud-table';
import { plantSchema } from '@/lib/validations/schemas';

export default function PlantsPage() {
  return <CrudTable table='plants' schema={plantSchema} title='Plants' fields={[{name:'registration_number',label:'Registration'},{name:'type',label:'Type'},{name:'project_id',label:'Project UUID'},{name:'supplier_id',label:'Supplier UUID'}]} />;
}
