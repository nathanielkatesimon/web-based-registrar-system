import { api } from "@/lib/api"
import DocumentRequestWizard from "./_components/document_request_wizard";

export default async function StudentDashboardRequestsPage() {
  const data = await api("/api/v1/document_types", "GET");
  const data_json = await data.json();
  
  return <DocumentRequestWizard document_types={data_json} />
}