interface SubscriptionUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    name: string;
    description: string;
    price: number;
    image_url: string;
  } | null;
}

export default function SubscriptionUpdateModal({ isOpen, onClose, plan }: SubscriptionUpdateModalProps) {
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
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
} 