import DemoPreviewModal from "@/components/modals/DemoPreviewModal";
import React from "react";

const DemoPage = () => {
  return (
    <DemoPreviewModal
      screenshot="/images/EsimDemoHero.png"
      blurIntensity="sm"
      overlayOpacity={90}
      logo="/images/adping-logo.svg"
      title="ADping – Smart Communication & Messaging Platform"
      tagline="Experience seamless communication with next-gen automation and multi-channel messaging"
      themeColor="#16A34A"
      infoNote={
        <>
          <strong>
            Access the ADping demo using the login details below
          </strong>
          <br />
          Explore our powerful messaging tools, automation flows, and channel
          management features. Certain actions may be limited for demo safety.
          <br />
          <span className="font-semibold">
            For full access to real-time messaging, campaigns, billing tools,
            and integrations, please register as a new user. Enjoy the complete
            ADping experience with no restrictions.
          </span>
          <br />
          <span className="mt-1 block text-xs text-gray-500">
            Demo data resets daily. No real messages or charges are generated.
          </span>
        </>
      }
      demoUrl="/login"
      superAdmin={{
        username: "demoadmin",
        password: "Admin@123",
      }}
      tenant={{
        username: "raman",
        password: "Raman@123",
      }}
      buttonLabel="🚀 Try ADping Demo"
      buttonLink="/login"
      bottomHelp="This is a demo environment. All activities are simulated and do not affect live user data, billing, or messaging."
      supportEmail="support@adping.com"
    />
  );
};

export default DemoPage;
