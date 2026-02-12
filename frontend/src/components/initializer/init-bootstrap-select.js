"use client";

import { useEffect } from "react";

export default function InitBootstrapSelect({ selector = ".selectpicker" }) {
  useEffect(() => {
    const $ = window.jQuery || window.$;
    if (!$ || !$.fn?.selectpicker) return;

    const $els = $(selector);
    $els.each(function () {
      const $el = $(this);
      if ($el.data("selectpicker")) $el.selectpicker("refresh");
      else $el.selectpicker();
    });

    return () => {
      $els.selectpicker("destroy");
    };
  }, [selector]);

  return null;
}
