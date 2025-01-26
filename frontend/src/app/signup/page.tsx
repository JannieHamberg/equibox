"use client";

import { Suspense } from 'react';
import SignupForm from "./components/signup-form";

export default function Signup() {
    return (
        <div className="mt-40">
            <Suspense fallback={<div className="flex justify-center items-center"><div className="loading loading-spinner loading-lg"></div></div>}>
                <SignupForm />
            </Suspense>
        </div>
    );
}