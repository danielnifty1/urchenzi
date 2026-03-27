import { OrderStatus } from "@/types";

const steps: OrderStatus[] = [
  "Pending",
  "Accepted",
  "Rider Assigned",
  "On the way",
  "Delivered",
];

export const OrderStatusTracker = ({ status }: { status: OrderStatus }) => {
  const activeIndex = steps.indexOf(status);

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <span
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              index <= activeIndex ? "bg-brand-strong text-white" : "bg-background text-muted"
            }`}
          >
            {index + 1}
          </span>
          <p className={index <= activeIndex ? "font-medium text-foreground" : "text-muted"}>
            {step}
          </p>
        </div>
      ))}
    </div>
  );
};
