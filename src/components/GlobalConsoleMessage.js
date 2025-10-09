"use client";

import { useEffect, useRef } from "react";

export default function GlobalConsoleMessage() {
  const hasLogged = useRef(false);

  useEffect(() => {
    if (!hasLogged.current) {
      hasLogged.current = true;
      console.log(`
             ::::::::::::::             
        ::::::::::    ::::::::::        
      :::::::: ::::--:::: ::::::::      
    ::::::::::: :::::::: :::::::::::    
  ::::::::::     ::::::  :::::::::::::  
 -:::::::::::::   ::::   :::::::::::::- 
::::  ::::::::::::::::::::::::::::: ::::
:::: :::::::::::::::::::::::::::::::::::
::: :::::                      +:::: :::
::: ::::     :::::   ::::::     :::: :::
::: :::::     -::::::::::      ::::: :::
:::   :::::                  ::::::  :::
::::   ::::::              ::::::   ::::
::::   ::::::              :::::+   ::::
 -::: ::::::                :::::: :::- 
  :::::::::                  :::::::::  
    ::::::                    ::::::    
      ::::::                -:::::      
        ::::::::        ::::::::        
           -::::::::::::::::-           

  

WHY ARE U HERE MY FRIEND? :>
Curious? Join us at https://chuyenbienhoa.com/jobs
    `);
    }
  }, []);

  return null; // This component doesn't render anything
}
