import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface MenuItem {
  title: string;
  url?: string;
  items?: MenuItem[];
}

function RecursiveMenu({ items }: { items: MenuItem[] }): React.ReactElement {
  return (
    <>
      {items.map(item => {
        const hasChildren = item.items && item.items.length > 0

        if (hasChildren) {
          return (
            <DropdownMenuSub key={item.title}>
              <DropdownMenuSubTrigger>
                {item.title}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <RecursiveMenu items={item.items!} />
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )
        }

        return (
          <DropdownMenuItem key={item.title} asChild>
            <a href={item.url}>{item.title}</a>
          </DropdownMenuItem>
        )
      })}
    </>
  )
}

export function Navbar() {
  const menu: MenuItem[] = [
    {
      title: "Planter",
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
      <div className="mx-auto flex h-12 max-w-screen-xl items-center gap-4 px-4">
        <a href="/" className="font-bold">3D Models</a>
        <nav className="flex gap-2">
          {menu.map(item => (
            <DropdownMenu key={item.title}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  {item.title}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <RecursiveMenu items={item.items || []} />
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>
      </div>
    </header>
  )
}
