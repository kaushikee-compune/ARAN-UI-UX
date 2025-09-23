export default function TestPage({ params }: { params: { id: string } }) {
  return <div>Patient ID is {params.id}</div>;
}
