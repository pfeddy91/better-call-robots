import { 
  LayoutDashboard, 
  Bot, 
  BarChart3, 
  Puzzle, 
  Phone,
  Mic,
  FileText
} from "lucide-react"
import { NavLink } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Build Agents", url: "/build/new", icon: Bot },
  { title: "The Briefing Room", url: "/briefing-room", icon: FileText },
  { title: "Evaluate", url: "/evaluate", icon: BarChart3 },
  { title: "Integrations", url: "/integrations", icon: Puzzle },
  { title: "Telephony", url: "/telephony", icon: Phone },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary text-primary-foreground font-medium shadow-elegant" 
      : "hover:bg-muted/50 text-sidebar-foreground hover:text-sidebar-foreground"

  return (
    <Sidebar
      className="transition-all duration-300 border-r bg-sidebar"
      collapsible="icon"
    >
      <SidebarContent className="px-4 py-6">
        {/* Brand */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            {!collapsed && (
              <span className="text-2xl tektur-logo text-sidebar-foreground">Better Call Robots</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "text-xs uppercase tracking-wider text-sidebar-foreground/60 mb-2"}>
            Main
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11 rounded-lg">
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}