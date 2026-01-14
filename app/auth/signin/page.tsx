import { SignInForm } from "./signin-form";
import { Footer } from "@/components/footer";

export default async function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <SignInForm />
      <Footer />
    </div>
  );
}
