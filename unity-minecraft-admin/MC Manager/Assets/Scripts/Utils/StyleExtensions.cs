using UnityEngine;
using UnityEngine.UIElements;
using System;

namespace MinecraftAdmin.UI
{
    /// <summary>
    /// Extension methods for IStyle to provide missing properties that Unity UIElements expects
    /// </summary>
    public static class StyleExtensions
    {
        /// <summary>
        /// Padding property extension (maps to individual padding properties)
        /// </summary>
        public static void SetPadding(this IStyle style, float all)
        {
            style.paddingTop = new StyleLength(new Length(all, LengthUnit.Pixel));
            style.paddingBottom = new StyleLength(new Length(all, LengthUnit.Pixel));
            style.paddingLeft = new StyleLength(new Length(all, LengthUnit.Pixel));
            style.paddingRight = new StyleLength(new Length(all, LengthUnit.Pixel));
        }

        /// <summary>
        /// Padding property extension with individual values
        /// </summary>
        public static void SetPadding(this IStyle style, float top, float right, float bottom, float left)
        {
            style.paddingTop = new StyleLength(new Length(top, LengthUnit.Pixel));
            style.paddingRight = new StyleLength(new Length(right, LengthUnit.Pixel));
            style.paddingBottom = new StyleLength(new Length(bottom, LengthUnit.Pixel));
            style.paddingLeft = new StyleLength(new Length(left, LengthUnit.Pixel));
        }

        /// <summary>
        /// Border property extension
        /// </summary>
        public static void SetBorder(this IStyle style, StyleBorder border)
        {
            style.borderTopWidth = border.top.width;
            style.borderRightWidth = border.right.width;
            style.borderBottomWidth = border.bottom.width;
            style.borderLeftWidth = border.left.width;
        }

        /// <summary>
        /// Border radius extension
        /// </summary>
        public static void SetBorderRadius(this IStyle style, float radius)
        {
            style.borderTopLeftRadius = new StyleLength(new Length(radius, LengthUnit.Pixel));
            style.borderTopRightRadius = new StyleLength(new Length(radius, LengthUnit.Pixel));
            style.borderBottomRightRadius = new StyleLength(new Length(radius, LengthUnit.Pixel));
            style.borderBottomLeftRadius = new StyleLength(new Length(radius, LengthUnit.Pixel));
        }

        /// <summary>
        /// Text align extension
        /// </summary>
        public static void SetTextAlign(this IStyle style, TextAnchor alignment)
        {
            // Convert TextAnchor to Unity UIElements alignment
            switch (alignment)
            {
                case TextAnchor.UpperLeft:
                case TextAnchor.MiddleLeft:
                case TextAnchor.LowerLeft:
                    style.alignItems = Align.FlexStart;
                    break;
                case TextAnchor.UpperCenter:
                case TextAnchor.MiddleCenter:
                case TextAnchor.LowerCenter:
                    style.alignItems = Align.Center;
                    break;
                case TextAnchor.UpperRight:
                case TextAnchor.MiddleRight:
                case TextAnchor.LowerRight:
                    style.alignItems = Align.FlexEnd;
                    break;
            }
        }
    }

    /// <summary>
    /// StyleBorder class for border configuration
    /// </summary>
    public class StyleBorder
    {
        public BorderEdge top;
        public BorderEdge right;
        public BorderEdge bottom;
        public BorderEdge left;

        public StyleBorder(BorderEdge edge)
        {
            top = new BorderEdge(edge.width, edge.color);
            right = new BorderEdge(edge.width, edge.color);
            bottom = new BorderEdge(edge.width, edge.color);
            left = new BorderEdge(edge.width, edge.color);
        }

        public StyleBorder(float width)
        {
            Color borderColor = Color.gray;
            top = new BorderEdge(width, borderColor);
            right = new BorderEdge(width, borderColor);
            bottom = new BorderEdge(width, borderColor);
            left = new BorderEdge(width, borderColor);
        }
    }

    /// <summary>
    /// BorderEdge class for individual border edge configuration
    /// </summary>
    public class BorderEdge
    {
        public float width;
        public Color color;

        public BorderEdge(float width)
        {
            this.width = width;
            this.color = Color.gray;
        }

        public BorderEdge(float width, Color color)
        {
            this.width = width;
            this.color = color;
        }
    }
}