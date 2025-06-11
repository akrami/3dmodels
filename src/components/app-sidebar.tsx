import * as React from "react"
import {
  BriefcaseBusiness,
  Cone,
  ContactRound,
  Sprout,
} from "lucide-react"
import { SiGithub } from "@icons-pack/react-simple-icons"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  navMain: [
  {
    title: "General Shapes",
    url: "/general-shapes",
    icon: BriefcaseBusiness,
    items: [
      {
        title: "Cylinder",
        url: "/general-shapes/cylinder",
      },
    ],
  },
  {
    title: "Planter",
    url: "/planter",
    icon: Sprout,
    items: [
      {
        title: "Wave",
        url: "/planter/wave",
      },
    ],
  },
]
,
  navSecondary: [
    {
      title: "Alireza",
      url: "https://alireza.akrami.io",
      icon: ContactRound,
    },
    {
      title: "Github",
      url: "https://github.com/akrami/3dmodels",
      icon: SiGithub,
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Cone className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Akrami</span>
                  <span className="truncate text-xs">Dev Toolbox</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  )
}
