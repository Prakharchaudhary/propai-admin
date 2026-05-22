import Link from 'next/link';
import PropertyForm from '@/components/admin/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/properties" className="text-slate-400 hover:text-white transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">Add Property</h1>
          <p className="text-slate-400 text-sm mt-0.5">Create a new property listing</p>
        </div>
      </div>
      <PropertyForm />
    </div>
  );
}
