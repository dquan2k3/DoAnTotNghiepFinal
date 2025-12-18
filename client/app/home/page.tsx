"use client";
import HomePost from "@/components/ui/HomePost";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black overflow-x-auto">
      <main
        className="
          grid
          min-h-screen

          /* >= 1156px */
          grid-cols-[1fr_minmax(475px,680px)_1fr]

          /* 906px – 1155px */
          max-[1155px]:grid-cols-[1fr_minmax(475px,680px)]

          /* 0px – 905px */
          max-[905px]:block max-[905px]:place-items-center
        "
      >
        {/* LEFT */}
        <aside className="flex justify-end bg-indigo-100 p-4 max-[1155px]:hidden">
          <div className="text-right font-semibold text-indigo-700">
            Bên trái
          </div>
        </aside>

        {/* CENTER */}
        <section
          className="
            flex justify-center
            max-[905px]:justify-center
          "
        >
          <div
            className="
              w-full min-w-[680px] max-w-[680px] mx-auto
              max-[680px]:min-w-[475px]
              max-[680px]:w-full
            "
          >
            <HomePost />
          </div>
        </section>

        {/* RIGHT */}
        <aside className="flex justify-start bg-emerald-100 p-4 max-[905px]:hidden">
          <div className="text-left font-semibold text-emerald-600">
            Bên phải
          </div>
        </aside>
      </main>
    </div>
  );
}
