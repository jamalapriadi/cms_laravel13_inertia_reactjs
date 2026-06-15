import { Autoplay, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import 'swiper/css';
import 'swiper/css/pagination';

interface SlideItem {
    id: string;
    title: string | null;
    subtitle: string | null;
    description: string | null;
    image_url: string | null;
    mobile_image_url: string | null;
    button_text: string | null;
    button_url: string | null;
}

interface Props {
    slides: SlideItem[];
}

export default function HomeBannerSlider({ slides }: Props) {
    if (!slides.length) {
        return null;
    }

    return (
        <section className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <Swiper
                modules={[Autoplay, Pagination]}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                loop={slides.length > 1}
                className="home-banner-swiper"
            >
                {slides.map((slide) => (
                    <SwiperSlide key={slide.id}>
                        <article className="relative h-[220px] w-full sm:h-[280px] lg:h-[360px]">
                            <picture>
                                {slide.mobile_image_url && (
                                    <source
                                        media="(max-width: 767px)"
                                        srcSet={slide.mobile_image_url}
                                    />
                                )}
                                <img
                                    src={
                                        slide.image_url ??
                                        slide.mobile_image_url ??
                                        ''
                                    }
                                    alt={slide.title || 'Banner'}
                                    className="h-full w-full object-cover"
                                />
                            </picture>

                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-transparent" />

                            <div className="absolute inset-0 flex items-center">
                                <div className="max-w-xl px-6 py-8 text-white sm:px-10">
                                    {slide.subtitle && (
                                        <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-white/90 uppercase">
                                            {slide.subtitle}
                                        </p>
                                    )}

                                    {slide.title && (
                                        <h2 className="text-2xl leading-tight font-bold sm:text-3xl lg:text-4xl">
                                            {slide.title}
                                        </h2>
                                    )}

                                    {slide.description && (
                                        <p className="mt-3 line-clamp-3 text-sm text-white/90 sm:text-base">
                                            {slide.description}
                                        </p>
                                    )}

                                    {slide.button_text && slide.button_url && (
                                        <a
                                            href={slide.button_url}
                                            className="mt-5 inline-flex rounded-md bg-white px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
                                        >
                                            {slide.button_text}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </article>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
}
