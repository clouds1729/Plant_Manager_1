'use client';
import { CrudTable } from '@/components/crud-table';
import { projectSchema } from '@/lib/validations/schemas';

export default function ProjectsPage() {
  return <CrudTable table='projects' schema={projectSchema} title='Projects' fields={[{name:'name',label:'Name'},{name:'location',label:'Location'}]} />;
}
