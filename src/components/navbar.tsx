import * as React from "react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Cone } from "lucide-react"
import { useTheme } from "@/hooks/use-theme"

interface MenuItem {
  title: string;
  url?: string;
  items?: MenuItem[];
}

export function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const menu: MenuItem[] = [
    {
      title: "Planters",
      items: [
        {
          title: "Wavy",
          items: [
            { title: "Top", url: "/planter/wavy/top" },
            { title: "Bottom", url: "/planter/wavy/bottom" },
            { title: "Connector", url: "/planter/wavy/connector" },
          ],
        },
      ],
    },
  ]

  return (
    <header className="border-b bg-background">
      <div className="flex h-12 w-full items-center gap-4 px-4">
        <a href="/" className="font-bold flex items-center gap-2">
          <Cone className="h-4 w-4" />
          3D Models
        </a>
        <NavigationMenu>
          <NavigationMenuList>
            {menu.map(item => (
              <NavigationMenuItem key={item.title}>
                {item.items && item.items.length > 0 ? (
                  <>
                    <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                        <div className="row-span-3">
                          <NavigationMenuLink asChild>
                            <a
                              className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                              href="/"
                            >
                              <Cone className="h-6 w-6" />
                              <div className="mb-2 mt-4 text-lg font-medium">
                                {item.title}
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Explore our collection of {item.title.toLowerCase()}
                              </p>
                            </a>
                          </NavigationMenuLink>
                        </div>
                        <div className="grid gap-1">
                          {item.items.map(subItem => (
                            <div key={subItem.title}>
                              {subItem.items && subItem.items.length > 0 ? (
                                <>
                                  <div className="text-sm font-medium text-muted-foreground mb-2">
                                    {subItem.title}
                                  </div>
                                  {subItem.items.map(subSubItem => (
                                    <NavigationMenuLink key={subSubItem.title} asChild>
                                      <a
                                        href={subSubItem.url}
                                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      >
                                        <div className="text-sm font-medium leading-none">
                                          {subSubItem.title}
                                        </div>
                                      </a>
                                    </NavigationMenuLink>
                                  ))}
                                </>
                              ) : (
                                <NavigationMenuLink key={subItem.title} asChild>
                                  <a
                                    href={subItem.url}
                                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  >
                                    <div className="text-sm font-medium leading-none">
                                      {subItem.title}
                                    </div>
                                  </a>
                                </NavigationMenuLink>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink asChild>
                    <a href={item.url}>{item.title}</a>
                  </NavigationMenuLink>
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="px-2"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
