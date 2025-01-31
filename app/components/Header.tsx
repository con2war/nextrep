import Link from "next/link"

export default function Header() {
  return (
    <header className="bg-secondary p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-primary text-2xl font-bold">
          FitApp
        </Link>
        <div className="space-x-4">
          <Link href="/" className="text-text hover:text-primary">
            Home
          </Link>
          <Link href="/daily-workout" className="text-text hover:text-primary">
            Daily Workout
          </Link>
          <Link href="/custom-workout" className="text-text hover:text-primary">
            Custom Workout
          </Link>
        </div>
      </nav>
    </header>
  )
}

