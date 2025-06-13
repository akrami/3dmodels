import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const menu = [
    {
      title: "Planter",
      url: "/planter",
      items: [
        { title: "Wave", url: "/planter/wave" },
      ],
    },
  ]

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-12 max-w-screen-xl items-center gap-4 px-4">
        <a href="/" className="font-bold">3D Models</a>
        <nav className="flex gap-2">
          {menu.map((item) => (
            <DropdownMenu key={item.title}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  {item.title}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <a href={item.url}>Overview</a>
                </DropdownMenuItem>
                {item.items.length ? <DropdownMenuSeparator /> : null}
                {item.items.map((sub) => (
                  <DropdownMenuItem key={sub.title} asChild>
                    <a href={sub.url}>{sub.title}</a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}
        </nav>
      </div>
    </header>
  )
}
