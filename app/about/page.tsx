import { HeroHeader } from "@/components/landingpage/hero-header"
import FooterSection from "@/components/landingpage/footer"
import { Sparkles } from "lucide-react"

export default function AboutPage() {
    return (
        <div className="flex flex-col min-h-screen overflow-auto">
            <HeroHeader />
            <main className="flex-1 flex flex-col items-center justify-center py-32 px-6">
                <div className="max-w-3xl mx-auto space-y-8 mt-12">
                    <div className="mx-auto flex w-fit items-center rounded-full border bg-muted/50 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                        <Sparkles className="mr-2 size-4 text-primary fill-primary/20" />
                        <span>Our Mission</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-center">
                        Rethinking How We Think
                    </h1>
                    
                    <div className="mt-12 mx-auto">
                        <p className="text-lg text-muted-foreground leading-relaxed text-center">
                            psLMP was born out of frustration with modern note-taking apps. 
                            They are either too complex, locking your data in the cloud, or too simple, 
                            missing the powerful features needed for true knowledge management.
                        </p>
                        
                        <div className="mt-16 space-y-8">
                            <h2 className="text-3xl font-semibold border-b pb-2">The Philosophy</h2>
                            <ul className="space-y-6 text-muted-foreground text-lg">
                                <li className="flex flex-col space-y-1">
                                    <strong className="text-foreground">Local First</strong> 
                                    <span>Your notes live on your machine. You own your data. You work completely offline.</span>
                                </li>
                                <li className="flex flex-col space-y-1">
                                    <strong className="text-foreground">100% Open Source</strong> 
                                    <span>Transparent, community-driven development without hidden subscriptions.</span>
                                </li>
                                <li className="flex flex-col space-y-1">
                                    <strong className="text-foreground">Bring Your Own AI</strong> 
                                    <span>Don't get locked into a single provider. Plug in OpenAI, Anthropic, DeepSeek, or run models locally.</span>
                                </li>
                                <li className="flex flex-col space-y-1">
                                    <strong className="text-foreground">Custom Blocks</strong> 
                                    <span>Flexibility to shape your workspace exactly how you need it with our block-based editor.</span>
                                </li>
                            </ul>
                        </div>

                        <p className="text-xl font-medium text-foreground leading-relaxed mt-16 text-center border-t pt-12">
                            We believe that a second brain should be an extension of yourself—private, 
                            fast, and endlessly customizable. Join us on our journey to build the ultimate 
                            open-source knowledge management tool.
                        </p>
                    </div>
                </div>
            </main>
            <FooterSection />
        </div>
    )
}
