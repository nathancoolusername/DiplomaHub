import { CornerUpLeft, ThumbsUp, User } from "lucide-react";
import { TitleTag } from "../pills";

export default function Comment() {
  return (
    <div className="flex flex-row gap-md w-full">
      <User
        size={50}
        className="p-sm border-1 border-outline-variamt rounded-xl"
      />
      <div className="flex flex-col gap-sm w-full">
        <div className="flex flex-col px-lg py-6 border-1 border-outline-variant rounded-xl w-full gap-lg bg-surface-container-lowest">
          <div className="flex flex-row justify-between">
            <div className="flex flex-row gap-sm">
              <h1 className="text-primary text-body-lg">Arnav Kapoor</h1>
              {TitleTag["Alumni"]}
              <h1 className="text-on-primary-fixed-variant font-bold">
                Diploma Pro
              </h1>
            </div>
            <h1 className="text-on-surface-container text-body-md">
              3 hours ago
            </h1>
          </div>
          <h1 className="text-body-lg">
            As someone who finished my EE last year, I'd emphasize the
            literature review part. It’s what separates a C from an A! Keep
            digging into those academic databases. Thank you for this, genuinely
            a lifesaver.
          </h1>
        </div>
        <div className="flex flex-row w-full gap-md">
          <div className="text-primary flex flex-row items-center gap-sm text-label-md border-b-1 border-white hover:border-primary cursor-pointer">
            <CornerUpLeft /> <h1 className="font-bold">Reply</h1>
          </div>
          <div className="text-on-surface-container flex flex-row items-center gap-sm text-label-md">
            <ThumbsUp className="hover:text-primary transition cursor-pointer" />{" "}
            <h1 className="text-body-md">67</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
