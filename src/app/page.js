import { Header, Main, Footer } from "./components";

export default function Home() {
    return (
        <div className="font-sans grid grid-rows-[20px_1fr_20px] min-h-screen py-10 px-8 gap-16 sm:p-20 w-full max-w-full">
            <Header />
            <Main />
            <Footer />
        </div>
    );
}
