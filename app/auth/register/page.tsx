import { RegisterForm } from "./register-form";
import { Footer } from "@/components/footer";

export default async function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <RegisterForm />
      <Footer />
    </div>
  );
}
