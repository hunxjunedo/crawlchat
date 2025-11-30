import type { Plan } from "libs/user-plan";
import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { PricingBoxes, PricingSwitch } from "~/landing/page";

export function UpgradeModal({
  starterPlan,
  proPlan,
  starterYearlyPlan,
  proYearlyPlan,
}: {
  starterPlan: Plan;
  proPlan: Plan;
  starterYearlyPlan: Plan;
  proYearlyPlan: Plan;
}) {
  const paymentFetcher = useFetcher();
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    if (paymentFetcher.data) {
      location.href = paymentFetcher.data.url;
    }
  }, [paymentFetcher.data]);

  // function handlePayClick(planId: string) {
  //   track("upgrade", {
  //     plan_id: planId,
  //   });

  //   paymentFetcher.submit(
  //     {
  //       intent: "payment-link",
  //       referralId: (window as any).affonso_referral,
  //       planId,
  //     },
  //     {
  //       method: "POST",
  //       action: "/app",
  //     }
  //   );
  // }

  return (
    <dialog id="upgrade-modal" className="modal z-90">
      <div className="modal-box w-11/12 max-w-5xl flex flex-col gap-8">
        <PricingSwitch yearly={yearly} setYearly={setYearly} />
        <div className="flex flex-col md:flex-row gap-4">
          <PricingBoxes
            starterPlan={starterPlan}
            proPlan={proPlan}
            // onClick={handlePayClick}
            starterYearlyPlan={starterYearlyPlan}
            proYearlyPlan={proYearlyPlan}
            yearly={yearly}
          />
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
