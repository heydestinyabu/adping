import React from "react";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import UseCases from "@/components/UseCases";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CTA from "@/components/CTA";
import { useQuery } from "@tanstack/react-query";
import { PlansDataTypes } from "@/types/types";


const Home = () => {
  const { data: paymentProviders } = useQuery<PlansDataTypes>({
    queryKey: ["/api/admin/plans"],
    queryFn: async () => {
      const res = await fetch("/api/admin/plans");
      return res.json();
    },
  });
  return (
    <>
      {/* <Header /> */}
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <Testimonials />
      {paymentProviders?.success && paymentProviders?.data?.length > 0 && (
        <Pricing />
      )}
      <CTA />
      {/* <Footer /> */}
    </>
  );
};

export default Home;
