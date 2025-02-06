import { SubscriptionDetailsModalProps } from '@/types/subscription';
import Link from 'next/link';

export default function SubscriptionDetailsModal({ isOpen, onClose, plan }: SubscriptionDetailsModalProps) {
  if (!plan) return null;

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-3xl">
        <form method="dialog">
          <button 
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={onClose}
          >
            ✕
          </button>
        </form>
        <h3 className="font-bold text-lg mb-4">{plan.name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img
              src={plan.image_url || '/boxar/fallback-image.webp'}
              alt={plan.name}
              className="w-full rounded-lg"
            />
          </div>
          <div>
            <p className="py-4">{plan.description}</p>
            <p className="text-lg font-semibold mt-4">
              {plan.price} SEK / månadsvis
            </p>
            <div className="mt-6">
              <Link href="/login" className="btn btn-primary w-auto px-6">
                Prenumerera
              </Link>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
} 