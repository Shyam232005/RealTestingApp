import Navbar from "@/components/home/Navbar"
import Footer from "@/components/home/Footer"
import LiveComplianceTicker from "@/components/dynamic/LiveComplianceTicker"

export default function PublicLayout({ children }) {
    return (
        <section className="min-h-screen flex flex-col">
            <LiveComplianceTicker />
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </section>
    )
}