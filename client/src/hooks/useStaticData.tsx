import { useTranslation } from "@/lib/i18n";
import {
  FileText,
  TrendingUp,
  BookOpen,
  Code,
  Calculator,
  Briefcase,
  Mail,
  Users,
  Zap,
} from "lucide-react";
import React from "react";

const useStaticData = () => {
  const { t } = useTranslation();
  const staticData = {
    header: {
      resourcesMenuItems: [
        {
          title: "Email Templates & Builder",
          path: "/email-templates",
          description: "Responsive visual email templates & builder",
          icon: Mail,
          image:
            "https://images.pexels.com/photos/193003/pexels-photo-193003.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
        },
        {
          title: t("Landing.header.resourcesMenuItems.0.title"),
          path: "/templates",
          description: t("Landing.header.resourcesMenuItems.0.description"),
          icon: FileText,
          image:
            "https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
        },
        {
          title: t("Landing.header.resourcesMenuItems.1.title"),
          path: "/case-studies",
          description: t("Landing.header.resourcesMenuItems.1.description"),
          icon: TrendingUp,
          image:
            "https://images.pexels.com/photos/1005638/pexels-photo-1005638.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
        },
        {
          title: t("Landing.header.resourcesMenuItems.2.title"),
          path: "/whatsapp-guide",
          description: t("Landing.header.resourcesMenuItems.2.description"),
          icon: BookOpen,
          image:
            "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
        },

        {
          title: t("Landing.header.resourcesMenuItems.4.title"),
          path: "/best-practices",
          description: t("Landing.header.resourcesMenuItems.4.description"),
          icon: BookOpen,
          image:
            "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
        },
      ],
      aboutMenuItems: [
        {
          title: t("Landing.header.aboutMenuItems.0.title"),
          path: "/about",
          description: t("Landing.header.aboutMenuItems.0.description"),
          icon: Users,
          image:
            "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
        },
        {
          title: t("Landing.header.aboutMenuItems.1.title"),
          path: "/contact",
          description: t("Landing.header.aboutMenuItems.1.description"),
          icon: Mail,
          image:
            "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
        },
        {
          title: t("Landing.header.aboutMenuItems.2.title"),
          path: "/careers",
          description: t("Landing.header.aboutMenuItems.2.description"),
          icon: Briefcase,
          image:
            "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
        },
        // {
        //   title: t("Landing.header.aboutMenuItems.3.title"),
        //   path: "/integrations",
        //   description: t("Landing.header.aboutMenuItems.3.description"),
        //   icon: Zap,
        //   image:
        //     "https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop",
        // },
      ],
    },
  };

  return staticData;
};

export default useStaticData;
