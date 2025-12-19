import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key");
}

import { UserSync } from "./components/UserSync";
import { OnboardingDialog } from "./components/OnboardingDialog";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    return (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <UserSync />
                <OnboardingDialog />
                {children}
            </ConvexProviderWithClerk>
        </ClerkProvider>
    );
}
