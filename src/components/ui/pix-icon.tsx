
import * as React from "react"

export const PixIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="h-6 w-6"
        {...props}
    >
        <path d="M7.56 3.83A6.56 6.56 0 0 0 4.2 9.1a6.56 6.56 0 0 0 3.37 5.27L4.2 20.17a.5.5 0 0 0 .5.83h3.28a.5.5 0 0 0 .5-.33l3.36-5.83a6.56 6.56 0 0 0 3.37-5.27 6.56 6.56 0 0 0-3.37-5.27L11.5 3.5a.5.5 0 0 0-.5-.33H7.72a.5.5 0 0 0-.16.66z" />
        <path d="m15.53 3.5-3.36 5.83a6.56 6.56 0 0 1 0 5.27l3.36 5.83a.5.5 0 0 0 .5.33h3.28a.5.5 0 0 0 .5-.83L16.44 14.1a6.56 6.56 0 0 1 0-5.27L19.8 3.5a.5.5 0 0 0-.5-.83h-3.28a.5.5 0 0 0-.5.33z" />
    </svg>
)

PixIcon.displayName = "PixIcon"
