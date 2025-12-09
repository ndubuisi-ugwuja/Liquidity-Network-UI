import { Header, Main, Footer } from "./components";

export default function Home() {
    return (
        <div className="font-sans grid grid-rows-[20px_1fr_20px] min-h-screen p-8 pb-20 gap-16 sm:p-20 w-auto">
            <Header />
            <Main />
            <Footer />
        </div>
    );
}
