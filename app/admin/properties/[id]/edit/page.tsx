'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { propertiesApi } from '@/lib/api';
import PropertyForm from '@/components/admin/PropertyForm';

export default function EditPropertyPage() {
  const { id } = useParams() as { id: string };
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all properties and find by id since there's no getById endpoint
    propertiesApi.getAll()
      .then(data => {
        const arr = Array.isArray(data) ? data : [];
        const found = arr.find((p: any) => p._id === id);
        setProperty(found || null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-slate-500 text-sm py-10 text-center">Loading...</div>;
  if (!property) return <div className="text-slate-500 text-sm py-10 text-center">Property not found</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/properties" className="text-slate-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">Edit Property</h1>
          <p className="text-slate-400 text-sm mt-0.5 line-clamp-1">{property.title}</p>
        </div>
      </div>
      <PropertyForm initial={property} propertyId={id} />
    </div>
  );
}
