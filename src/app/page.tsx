import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "./get-query-client";
import { Initial } from "../components/Initial";

export default function Home() {
  const queryClient = getQueryClient();

  return (
    <main>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <div className="flex justify-center items-center sm:my-10 my-4">
          <div className="w-full max-w-xl px-4">
            <Initial />
          </div>
        </div>
      </HydrationBoundary>
    </main>
  );
}
