import { Link } from 'react-router-dom'

export default function Navbar() {
    return (
        <nav className="navbar">
            <Link to="/"><button>Home</button></Link>
            <Link to="/schedule"><button>Schedule</button></Link>
            <Link to="/timer"><button>Timer</button></Link>
            <Link to="/stats"><button>Stats</button></Link>
        </nav>
    )
}