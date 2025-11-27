/*
 * SimpleJSON Library for Unity - Working Version
 */

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MinecraftAdmin.Utils
{
    public enum JSONTextMode
    {
        Compact,
        Indent
    }

    public enum JSONNodeType
    {
        Array = 1,
        Object = 2,
        String = 3,
        Number = 4,
        NullValue = 5,
        Boolean = 6,
        None = 7
    }

    public abstract partial class JSONNode
    {
        #region common interface

        public virtual JSONNodeType Type { get; protected set; }

        public virtual List<JSONNode> Childs { get { return new List<JSONNode>(); } }
        public virtual IEnumerable<KeyValuePair<string, JSONNode>> Keys { get { return new List<KeyValuePair<string, JSONNode>>(); } }
        public virtual JSONNode this[int aIndex] { get { return null; } set { } }
        public virtual JSONNode this[string aKey] { get { return null; } set { } }

        public virtual string Value { get { return ""; } set { } }
        public virtual int Count { get { return 0; } }

        public virtual void Add(string aKey, JSONNode aItem)
        {
        }

        public virtual void Add(JSONNode aItem)
        {
            Add("", aItem);
        }

        public virtual JSONNode Remove(string aKey)
        {
            return null;
        }

        public virtual JSONNode Remove(int aIndex)
        {
            return null;
        }

        public virtual JSONNode Remove(JSONNode aNode)
        {
            return aNode;
        }

        public virtual bool IsNumber { get { return false; } }
        public virtual bool IsString { get { return false; } }
        public virtual bool IsArray { get { return false; } }
        public virtual bool IsObject { get { return false; } }
        public virtual bool IsNull { get { return false; } }
        public virtual bool IsBoolean { get { return false; } }

        internal abstract void Serialize(System.IO.TextWriter aWriter, string aPrefix, string aIndent, JSONTextMode aMode);

        #endregion common interface

        #region typecasting properties

        public virtual double AsDouble
        {
            get
            {
                double v = 0.0;
                if (double.TryParse(Value, out v))
                    return v;
                return 0.0;
            }
            set
            {
                Value = value.ToString();
            }
        }

        public virtual int AsInt
        {
            get { return (int)AsDouble; }
            set { AsDouble = value; }
        }

        public virtual float AsFloat
        {
            get { return (float)AsDouble; }
            set { AsDouble = value; }
        }

        public virtual bool AsBool
        {
            get
            {
                bool v = false;
                if (bool.TryParse(Value, out v))
                    return v;
                return !string.IsNullOrEmpty(Value);
            }
            set
            {
                Value = (value) ? "true" : "false";
            }
        }

        public virtual long AsLong
        {
            get
            {
                long v = 0;
                if (long.TryParse(Value, out v))
                    return v;
                return 0L;
            }
            set
            {
                Value = value.ToString();
            }
        }

        #endregion typecasting properties

        #region operators
        public static implicit operator JSONNode(string s)
        {
            return new JSONString(s);
        }
        public static implicit operator string(JSONNode n)
        {
            return n?.Value;
        }
        public static implicit operator JSONNode(double n)
        {
            return new JSONNumber(n);
        }
        public static implicit operator double(JSONNode n)
        {
            return n.AsDouble;
        }
        public static implicit operator JSONNode(float n)
        {
            return new JSONNumber(n);
        }
        public static implicit operator float(JSONNode n)
        {
            return n.AsFloat;
        }
        public static implicit operator JSONNode(int n)
        {
            return new JSONNumber(n);
        }
        public static implicit operator int(JSONNode n)
        {
            return n.AsInt;
        }
        public static implicit operator JSONNode(long n)
        {
            return new JSONNumber(n);
        }
        public static implicit operator long(JSONNode n)
        {
            return n.AsLong;
        }
        public static implicit operator JSONNode(bool b)
        {
            return new JSONBool(b);
        }
        public static implicit operator bool(JSONNode n)
        {
            return n.AsBool;
        }
        #endregion operators

        public static JSONNode Parse(string aJSON)
        {
            return Parse(aJSON, new Stack<string>());
        }

        // Overload for compatibility with existing code that calls Parse with 2 arguments
        public static JSONNode Parse(string aJSON, Stack<string> aStack)
        {
            return InternalParse(aJSON, aStack);
        }

        private static JSONNode InternalParse(string aJSON, Stack<string> aStack)
        {
            aJSON = aJSON.Trim();
            if (aJSON.Length == 0)
                return null;

            switch (aJSON[0])
            {
                case '{':
                    return JSONObject.Parse(aJSON, aStack);
                case '[':
                    return JSONArray.Parse(aJSON, aStack);
                case '"':
                    return JSONString.Parse(aJSON);
                case 't':
                case 'f':
                    return JSONBool.Parse(aJSON);
                case 'n':
                    return JSONNull.Parse(aJSON);
                default:
                    if (aJSON[0] == '-' || (aJSON[0] >= '0' && aJSON[0] <= '9'))
                        return JSONNumber.Parse(aJSON);
                    else
                        return null; // error condition
            }
        }

        protected static string Escape(string aText)
        {
            var sb = new StringBuilder();
            foreach (char c in aText)
            {
                switch (c)
                {
                    case '\\':
                        sb.Append("\\\\");
                        break;
                    case '\"':
                        sb.Append("\\\"");
                        break;
                    case '\n':
                        sb.Append("\\n");
                        break;
                    case '\r':
                        sb.Append("\\r");
                        break;
                    case '\t':
                        sb.Append("\\t");
                        break;
                    case '\b':
                        sb.Append("\\b");
                        break;
                    case '\f':
                        sb.Append("\\f");
                        break;
                    default:
                        if (c < ' ' || (int)c > 127)
                        {
                            sb.Append("\\u");
                            sb.Append(((int)c).ToString("X4"));
                        }
                        else
                        {
                            sb.Append(c);
                        }
                        break;
                }
            }
            return sb.ToString();
        }
    }

    public partial class JSONArray : JSONNode, IEnumerable
    {
        private List<JSONNode> mList = new List<JSONNode>();
        private bool mInline = false;

        public override JSONNodeType Type { get { return JSONNodeType.Array; } }
        public override int Count { get { return mList.Count; } }

        public override JSONNode this[int aIndex]
        {
            get
            {
                if (aIndex < 0 || aIndex >= mList.Count)
                    return new JSONLazyCreator(this);
                return mList[aIndex];
            }
            set
            {
                if (aIndex < 0 || aIndex >= mList.Count)
                    mList.Add(value);
                else
                    mList[aIndex] = value;
            }
        }

        public override JSONNode this[string aKey]
        {
            get { return new JSONLazyCreator(this); }
            set { mList.Add(value); }
        }

        public override List<JSONNode> Childs { get { return mList; } }

        public override void Add(string aKey, JSONNode aItem)
        {
            mList.Add(aItem);
        }

        public override JSONNode Remove(int aIndex)
        {
            if (aIndex < 0 || aIndex >= mList.Count)
                return null;
            JSONNode tmp = mList[aIndex];
            mList.RemoveAt(aIndex);
            return tmp;
        }

        public override JSONNode Remove(JSONNode aNode)
        {
            mList.Remove(aNode);
            return aNode;
        }

        internal override void Serialize(System.IO.TextWriter aWriter, string aPrefix, string aIndent, JSONTextMode aMode)
        {
            aWriter.Write('[');
            bool first = true;
            if (mInline)
                aMode = JSONTextMode.Compact;
            foreach (var child in mList)
            {
                if (!first)
                    aWriter.Write(',');
                if (aMode == JSONTextMode.Indent)
                    aWriter.WriteLine();
                if (aMode == JSONTextMode.Indent)
                    aWriter.Write(aPrefix + aIndent);
                child.Serialize(aWriter, aPrefix, aIndent, aMode);
                first = false;
            }
            if (aMode == JSONTextMode.Indent)
                aWriter.WriteLine();
            if (aMode == JSONTextMode.Indent && aPrefix != null)
                aWriter.Write(aPrefix);
            aWriter.Write(']');
        }

        public static JSONArray Parse(string aJSON, Stack<string> aStack)
        {
            aStack.Push("Array");
            JSONArray node = new JSONArray();
            int offset = 1;
            int count = aJSON.Length - 2;

            while (offset < aJSON.Length && count > 0)
            {
                int sep = -1;
                int nested = 0;
                string token = aJSON.Substring(offset, count);

                // Find the separating comma or the closing bracket
                for (int i = 0; i < token.Length; i++)
                {
                    switch (token[i])
                    {
                        case '{':
                        case '[':
                            nested++;
                            break;
                        case '}':
                        case ']':
                            nested--;
                            break;
                        case '"':
                            // Skip strings to avoid nested separators
                            int endQuote = token.IndexOf('"', i + 1);
                            if (endQuote != -1)
                                i = endQuote;
                            else
                                i = token.Length; // Invalid JSON, break to avoid infinite loop
                            continue;
                        case ',':
                            if (nested == 0)
                            {
                                sep = i;
                                break;
                            }
                            continue;
                        case ':':
                            if (nested == 0)
                            {
                                throw new Exception($"JSON Exception: Invalid array token at {aStack.Peek()}");
                            }
                            continue;
                    }
                    if (sep != -1)
                        break;
                }
                if (sep == -1)
                    sep = token.Length;

                node.Add(JSONNode.Parse(token.Substring(0, sep), aStack));
                count -= sep + 1;
                offset += sep + 1;
            }

            aStack.Pop();
            return node;
        }

        public JSONArray(bool inline)
        {
            mInline = inline;
        }

        public JSONArray() { }

        public IEnumerator GetEnumerator()
        {
            return mList.GetEnumerator();
        }
    }

    public partial class JSONObject : JSONNode, IEnumerable
    {
        private Dictionary<string, JSONNode> mDict = new Dictionary<string, JSONNode>();
        private bool mInline = false;

        public override JSONNodeType Type { get { return JSONNodeType.Object; } }
        public override int Count { get { return mDict.Count; } }

        public override JSONNode this[int aIndex]
        {
            get
            {
                if (aIndex < 0 || aIndex >= mDict.Count)
                    return null;
                return mDict.ElementAt(aIndex).Value;
            }
            set
            {
                if (aIndex < 0 || aIndex >= mDict.Count)
                    return;
                var key = mDict.ElementAt(aIndex).Key;
                mDict[key] = value;
            }
        }

        public override JSONNode this[string aKey]
        {
            get
            {
                if (mDict.ContainsKey(aKey))
                    return mDict[aKey];
                else
                    return new JSONLazyCreator(this, aKey);
            }
            set
            {
                if (mDict.ContainsKey(aKey))
                    mDict[aKey] = value;
                else
                    mDict.Add(aKey, value);
            }
        }

        public override List<JSONNode> Childs
        {
            get
            {
                return mDict.Values.ToList();
            }
        }

        public override IEnumerable<KeyValuePair<string, JSONNode>> Keys
        {
            get
            {
                foreach(KeyValuePair<string, JSONNode> kvp in mDict)
                {
                    yield return kvp;
                }
            }
        }

        public override void Add(string aKey, JSONNode aItem)
        {
            if (!string.IsNullOrEmpty(aKey))
            {
                if (mDict.ContainsKey(aKey))
                    mDict[aKey] = aItem;
                else
                    mDict.Add(aKey, aItem);
            }
            else
            {
                mDict.Add(Guid.NewGuid().ToString(), aItem);
            }
        }

        public override JSONNode Remove(string aKey)
        {
            if (!mDict.ContainsKey(aKey))
                return null;
            JSONNode tmp = mDict[aKey];
            mDict.Remove(aKey);
            return tmp;
        }

        public override JSONNode Remove(int aIndex)
        {
            if (aIndex < 0 || aIndex >= mDict.Count)
                return null;
            var item = mDict.ElementAt(aIndex);
            mDict.Remove(item.Key);
            return item.Value;
        }

        public override JSONNode Remove(JSONNode aNode)
        {
            try
            {
                var item = mDict.Where(k => k.Value == aNode).First();
                mDict.Remove(item.Key);
                return aNode;
            }
            catch
            {
                return null;
            }
        }

        internal override void Serialize(System.IO.TextWriter aWriter, string aPrefix, string aIndent, JSONTextMode aMode)
        {
            aWriter.Write('{');
            bool first = true;
            if (mInline)
                aMode = JSONTextMode.Compact;
            foreach (var k in mDict)
            {
                if (!first)
                    aWriter.Write(',');
                if (aMode == JSONTextMode.Indent)
                    aWriter.WriteLine();
                if (aMode == JSONTextMode.Indent)
                    aWriter.Write(aPrefix + aIndent);
                aWriter.Write('\"');
                aWriter.Write(Escape(k.Key));
                aWriter.Write('\"');
                if (aMode == JSONTextMode.Compact)
                    aWriter.Write(':');
                else
                    aWriter.Write(": ");
                k.Value.Serialize(aWriter, aPrefix, aIndent, aMode);
                first = false;
            }
            if (aMode == JSONTextMode.Indent)
                aWriter.WriteLine();
            if (aMode == JSONTextMode.Indent && aPrefix != null)
                aWriter.Write(aPrefix);
            aWriter.Write('}');
        }

        public static JSONObject Parse(string aJSON, Stack<string> aStack)
        {
            aStack.Push("Object");
            JSONObject node = new JSONObject();
            int offset = 1;
            int count = aJSON.Length - 2;

            while (offset < aJSON.Length && count > 0)
            {
                int sep = -1;
                int nested = 0;
                string token = aJSON.Substring(offset, count);

                // Find the separating comma or the closing bracket
                for (int i = 0; i < token.Length; i++)
                {
                    switch (token[i])
                    {
                        case '{':
                        case '[':
                            nested++;
                            break;
                        case '}':
                        case ']':
                            nested--;
                            break;
                        case ':':
                            if (nested == 0)
                            {
                                sep = i;
                                break;
                            }
                            continue;
                        case '"':
                            // Skip strings to avoid nested separators
                            int endQuote = token.IndexOf('"', i + 1);
                            if (endQuote != -1)
                                i = endQuote;
                            else
                                i = token.Length; // Invalid JSON, break to avoid infinite loop
                            continue;
                    }
                    if (sep != -1)
                        break;
                }
                if (sep == -1)
                    sep = token.Length;

                // Split key/value
                string key = token.Substring(0, sep);
                // Remove leading and trailing quotes from key
                if (key.Length > 1 && key[0] == '\"' && key[key.Length - 1] == '\"')
                {
                    key = key.Substring(1, key.Length - 2);
                }
                // Skip the colon
                int nextObj = sep + 1;
                // Skip potential whitespace between colon and value
                while (nextObj < token.Length && (token[nextObj] == ' ' || token[nextObj] == '\t'))
                    nextObj++;
                string value = token.Substring(nextObj, token.Length - nextObj);
                // Skip potential whitespace after value
                while (value.Length > 0 && (value[value.Length - 1] == ' ' || value[value.Length - 1] == '\t'))
                    value = value.Substring(0, value.Length - 1);

                node.Add(key, JSONNode.Parse(value, aStack));
                count -= sep + 1;
                offset += sep + 1;
            }

            aStack.Pop();
            return node;
        }

        public JSONObject(bool inline)
        {
            mInline = inline;
        }

        public JSONObject() { }

        // Implement the generic IEnumerable interface to enable foreach loops with KeyValuePair
        public IEnumerator<KeyValuePair<string, JSONNode>> GetEnumerator()
        {
            return mDict.GetEnumerator();
        }

        // Explicit IEnumerator implementation for non-generic interface
        IEnumerator IEnumerable.GetEnumerator()
        {
            return mDict.GetEnumerator();
        }
    }

    public partial class JSONString : JSONNode
    {
        private string m_Data;

        public override JSONNodeType Type { get { return JSONNodeType.String; } }
        public override string Value
        {
            get { return m_Data; }
            set { m_Data = value; }
        }
        public override bool IsString { get { return true; } }

        public JSONString(string aData)
        {
            m_Data = aData;
        }

        internal override void Serialize(System.IO.TextWriter aWriter, string aPrefix, string aIndent, JSONTextMode aMode)
        {
            aWriter.Write('\"');
            aWriter.Write(Escape(m_Data));
            aWriter.Write('\"');
        }

        public static new JSONString Parse(string aJSON)
        {
            string result = "";
            int len = aJSON.Length - 2;
            for (int i = 1; i < len; i++)
            {
                if (aJSON[i] == '\\' && i + 1 < len)
                {
                    switch (aJSON[++i])
                    {
                        case '\"':
                            result += '\"';
                            break;
                        case '\\':
                            result += '\\';
                            break;
                        case '/':
                            result += '/';
                            break;
                        case 'b':
                            result += '\b';
                            break;
                        case 'f':
                            result += '\f';
                            break;
                        case 'n':
                            result += '\n';
                            break;
                        case 'r':
                            result += '\r';
                            break;
                        case 't':
                            result += '\t';
                            break;
                        case 'u':
                            if (i + 4 < len)
                            {
                                string hex = aJSON.Substring(i + 1, 4);
                                result += (char)int.Parse(hex, System.Globalization.NumberStyles.HexNumber);
                                i += 4;
                            }
                            else
                            {
                                result += 'u';
                            }
                            break;
                        default:
                            result += aJSON[i];
                            break;
                    }
                }
                else
                {
                    result += aJSON[i];
                }
            }
            return new JSONString(result);
        }
    }

    public partial class JSONNumber : JSONNode
    {
        private double m_Data;

        public override JSONNodeType Type { get { return JSONNodeType.Number; } }
        public override string Value
        {
            get { return m_Data.ToString(); }
            set
            {
                double v;
                if (double.TryParse(value, out v))
                    m_Data = v;
            }
        }
        public override bool IsNumber { get { return true; } }
        public override double AsDouble
        {
            get { return m_Data; }
            set { m_Data = value; }
        }

        public JSONNumber(double aData)
        {
            m_Data = aData;
        }

        public JSONNumber(string aData)
        {
            Value = aData;
        }

        internal override void Serialize(System.IO.TextWriter aWriter, string aPrefix, string aIndent, JSONTextMode aMode)
        {
            aWriter.Write(Value);
        }

        public static new JSONNumber Parse(string aJSON)
        {
            double result;
            double.TryParse(aJSON, out result);
            return new JSONNumber(result);
        }
    }

    public partial class JSONBool : JSONNode
    {
        private bool m_Data;

        public override JSONNodeType Type { get { return JSONNodeType.Boolean; } }
        public override string Value
        {
            get { return m_Data.ToString().ToLower(); }
            set
            {
                bool v;
                if (bool.TryParse(value, out v))
                    m_Data = v;
            }
        }
        public override bool AsBool
        {
            get { return m_Data; }
            set { m_Data = value; }
        }
        public override bool IsBoolean { get { return true; } }

        public JSONBool(bool aData)
        {
            m_Data = aData;
        }

        public JSONBool(string aData)
        {
            Value = aData;
        }

        internal override void Serialize(System.IO.TextWriter aWriter, string aPrefix, string aIndent, JSONTextMode aMode)
        {
            aWriter.Write(Value);
        }

        public static new JSONBool Parse(string aJSON)
        {
            bool result;
            bool.TryParse(aJSON, out result);
            return new JSONBool(result);
        }
    }

    public partial class JSONNull : JSONNode
    {
        public override JSONNodeType Type { get { return JSONNodeType.NullValue; } }
        public override string Value
        {
            get { return "null"; }
            set { }
        }
        public override bool AsBool { get { return false; } set { } }
        public override bool IsNull { get { return true; } }

        public override bool Equals(object obj)
        {
            if (obj == null)
                return true;
            return obj is JSONNull;
        }
        public override int GetHashCode()
        {
            return 0;
        }

        internal override void Serialize(System.IO.TextWriter aWriter, string aPrefix, string aIndent, JSONTextMode aMode)
        {
            aWriter.Write("null");
        }

        public static new JSONNull Parse(string aJSON)
        {
            return new JSONNull();
        }
    }

    internal partial class JSONLazyCreator : JSONNode
    {
        private JSONNode m_Node = null;
        private string m_Key = null;

        public override JSONNodeType Type { get { return JSONNodeType.None; } }

        public JSONLazyCreator(JSONNode aNode)
        {
            m_Node = aNode;
            m_Key = null;
        }

        public JSONLazyCreator(JSONNode aNode, string aKey)
        {
            m_Node = aNode;
            m_Key = aKey;
        }

        private void Set(JSONNode aVal)
        {
            if (m_Key == null)
            {
                m_Node.Add(aVal);
            }
            else
            {
                m_Node.Add(m_Key, aVal);
            }
            m_Node = null; // Be GC friendly
        }

        public override string Value
        {
            get
            {
                return "";
            }
            set
            {
                if (m_Node != null)
                    Set(new JSONString(value));
            }
        }

        public override JSONNode this[int aIndex]
        {
            get
            {
                return new JSONLazyCreator(this);
            }
            set
            {
                if (m_Node != null)
                {
                    Set(new JSONArray());
                    m_Node.Add(value);
                }
            }
        }

        public override JSONNode this[string aKey]
        {
            get
            {
                if (m_Node != null)
                {
                    if (m_Node is JSONArray)
                        Set(new JSONObject());
                    else if (m_Key != null)
                    {
                        var tmp = new JSONObject();
                        m_Node.Add(m_Key, tmp);
                        Set(tmp);
                    }
                    return new JSONLazyCreator(m_Node as JSONObject, aKey);
                }
                return null;
            }
            set
            {
                if (m_Node != null)
                {
                    if (m_Node is JSONArray)
                        Set(new JSONObject());
                    else if (m_Key != null)
                    {
                        var tmp = new JSONObject();
                        m_Node.Add(m_Key, tmp);
                        Set(tmp);
                    }
                    m_Node.Add(aKey, value);
                }
            }
        }

        internal override void Serialize(System.IO.TextWriter aWriter, string aPrefix, string aIndent, JSONTextMode aMode)
        {
            aWriter.Write("null");
        }
    }

    public static class JSON
    {
        public static JSONNode Parse(string aJSON)
        {
            return JSONNode.Parse(aJSON, new Stack<string>());
        }
    }
}