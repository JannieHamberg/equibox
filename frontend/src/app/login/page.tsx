import { Suspense } from 'react';
import LoginForm from "./components/login";  

export default function Login() {
    return (
        <div className="mt-40">
            <Suspense fallback={<div className="flex justify-center items-center">
                <div className="loading loading-spinner loading-lg"></div>
            </div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}