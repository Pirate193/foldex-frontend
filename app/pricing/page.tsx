import { HeroHeader } from "@/components/landingpage/hero-header"
import FooterSection from "@/components/landingpage/footer"
import { Sparkles, HeartHandshake } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PricingPage() {
    return (
        <div className="flex flex-col min-h-screen overflow-auto">
            <HeroHeader />
            <main className="flex-1 flex flex-col items-center justify-center py-32 px-6">
                <div className="max-w-2xl mx-auto text-center space-y-8 mt-12">
                    <div className="inline-flex items-center rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                        <Sparkles className="mr-2 size-4 text-primary fill-primary/20" />
                        <span>Pricing Plan</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                        Wait... Pricing? <br/> For an Open Source App?
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        Gotcha! 🎉 psLMP is <strong>100% free and open-source</strong>. We don't have paywalls, premium tiers, or hidden subscriptions. Your data is yours, and the code is open for everyone.
                    </p>
                    
                    <div className="pt-8 border-t mt-12 space-y-6">
                        <h2 className="text-2xl font-semibold">Keep the servers running!</h2>
                        <p className="text-muted-foreground">
                            While the app is free, running the website and keeping development active takes time and resources. If you love what we do, consider buying us a coffee!
                        </p>
                        <Button size="lg" className="rounded-full px-8 h-12 gap-2 cursor-pointer">
                            <HeartHandshake className="size-5" />
                            Donate to the Project
                        </Button>
                    </div>
                </div>
            </main>
            <FooterSection />
        </div>
    )
}
